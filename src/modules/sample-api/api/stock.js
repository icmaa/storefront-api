import { Router } from 'express';

export default ({ config, db }) => {
  const api = Router();

  /**
   * GET get stock item
   *
   * req.params.sku - sku of the prodduct to check
   *
   * Details: https://sfa-docs.now.sh/guide/default-modules/api.html#get-vsbridgestockchecksku
   *
   */
  api.get('/check/:sku', (req, res) => {
    res.json({
      code: 200,
      result: {
        item_id: 580,
        product_id: 580, // required field
        stock_id: 1,
        qty: 53, // required field
        is_in_stock: true, // required field
        is_qty_decimal: false,
        show_default_notification_message: false,
        use_config_min_qty: true,
        min_qty: 0,
        use_config_min_sale_qty: 1,
        min_sale_qty: 1,
        use_config_max_sale_qty: true,
        max_sale_qty: 10000,
        use_config_backorders: true,
        backorders: 0,
        use_config_notify_stock_qty: true,
        notify_stock_qty: 1,
        use_config_qty_increments: true,
        qty_increments: 0,
        use_config_enable_qty_inc: true,
        enable_qty_increments: false,
        use_config_manage_stock: true,
        manage_stock: true,
        low_stock_date: null,
        is_decimal_divided: false,
        stock_status_changed_auto: 0
      }
    });
  });

  /**
   * GET get stock item - 2nd version with the query url parameter
   *
   * req.query.url  - sku of the product to check
   */
  api.get('/check', (req, res) => {
    res.json({
      code: 200,
      result: {
        item_id: 580,
        product_id: 580, // required field
        stock_id: 1,
        qty: 53, // required field
        is_in_stock: true, // required field
        is_qty_decimal: false,
        show_default_notification_message: false,
        use_config_min_qty: true,
        min_qty: 0,
        use_config_min_sale_qty: 1,
        min_sale_qty: 1,
        use_config_max_sale_qty: true,
        max_sale_qty: 10000,
        use_config_backorders: true,
        backorders: 0,
        use_config_notify_stock_qty: true,
        notify_stock_qty: 1,
        use_config_qty_increments: true,
        qty_increments: 0,
        use_config_enable_qty_inc: true,
        enable_qty_increments: false,
        use_config_manage_stock: true,
        manage_stock: true,
        low_stock_date: null,
        is_decimal_divided: false,
        stock_status_changed_auto: 0
      }
    });
  });

  /**
   * GET get stock item list by skus (comma separated)
   *
   * req.query.skus = url encoded list of the SKUs
   */
  api.get('/list', (req, res) => {
    res.json({
      code: 200,
      result: [
        {
          item_id: 580,
          product_id: 580, // requirerd field
          stock_id: 1,
          qty: 53, // required field
          is_in_stock: true, // required field
          is_qty_decimal: false,
          show_default_notification_message: false,
          use_config_min_qty: true,
          min_qty: 0,
          use_config_min_sale_qty: 1,
          min_sale_qty: 1,
          use_config_max_sale_qty: true,
          max_sale_qty: 10000,
          use_config_backorders: true,
          backorders: 0,
          use_config_notify_stock_qty: true,
          notify_stock_qty: 1,
          use_config_qty_increments: true,
          qty_increments: 0,
          use_config_enable_qty_inc: true,
          enable_qty_increments: false,
          use_config_manage_stock: true,
          manage_stock: true,
          low_stock_date: null,
          is_decimal_divided: false,
          stock_status_changed_auto: 0
        }
      ]
    });
  });

  return api;
};
